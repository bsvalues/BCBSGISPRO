use actix_web::{web, Error, HttpRequest, HttpResponse};
use actix_web_actors::ws;
use std::time::{Duration, Instant};
use actix::{Actor, ActorContext, AsyncContext, StreamHandler};

/// How often heartbeat pings are sent
const HEARTBEAT_INTERVAL: Duration = Duration::from_secs(5);
/// How long before lack of client response causes a timeout
const CLIENT_TIMEOUT: Duration = Duration::from_secs(10);

/// WebSocket connection actor
struct TerraFusionWebSocket {
    /// Client must send ping at least once per 10 seconds (CLIENT_TIMEOUT),
    /// otherwise we drop connection.
    hb: Instant,
    /// User ID (optional)
    user_id: Option<String>,
}

impl Actor for TerraFusionWebSocket {
    type Context = ws::WebsocketContext<Self>;

    /// Method is called on actor start.
    /// We start the heartbeat process here.
    fn started(&mut self, ctx: &mut Self::Context) {
        self.hb(ctx);
        
        // Send welcome message
        let welcome_msg = serde_json::json!({
            "type": "system",
            "data": {
                "message": "Welcome to TerraFusion Platform WebSocket",
                "timestamp": chrono::Utc::now().to_rfc3339()
            }
        });
        
        ctx.text(welcome_msg.to_string());
    }
}

/// Handler for ws::Message
impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for TerraFusionWebSocket {
    fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        match msg {
            Ok(ws::Message::Ping(msg)) => {
                self.hb = Instant::now();
                ctx.pong(&msg);
            }
            Ok(ws::Message::Pong(_)) => {
                self.hb = Instant::now();
            }
            Ok(ws::Message::Text(text)) => {
                // Try to parse JSON message
                if let Ok(data) = serde_json::from_str::<serde_json::Value>(&text) {
                    // Get the message type
                    let msg_type = data.get("type").and_then(|t| t.as_str()).unwrap_or("unknown");
                    
                    // Process based on message type
                    match msg_type {
                        "userPosition" => {
                            // Echo back the position data as an acknowledgment
                            let response = serde_json::json!({
                                "type": "positionAck",
                                "data": data.get("data"),
                                "timestamp": chrono::Utc::now().to_rfc3339()
                            });
                            ctx.text(response.to_string());
                        },
                        "chat" => {
                            // Echo back the chat message
                            let response = serde_json::json!({
                                "type": "chatReceived",
                                "data": data.get("data"),
                                "timestamp": chrono::Utc::now().to_rfc3339()
                            });
                            ctx.text(response.to_string());
                        },
                        "test" => {
                            // Respond to test messages
                            let response = serde_json::json!({
                                "type": "testResponse",
                                "data": {
                                    "message": "Test message received",
                                    "originalData": data.get("data"),
                                    "timestamp": chrono::Utc::now().to_rfc3339()
                                }
                            });
                            ctx.text(response.to_string());
                        },
                        _ => {
                            // Handle unknown message types
                            let response = serde_json::json!({
                                "type": "error",
                                "data": {
                                    "message": format!("Unknown message type: {}", msg_type),
                                    "timestamp": chrono::Utc::now().to_rfc3339()
                                }
                            });
                            ctx.text(response.to_string());
                        }
                    }
                } else {
                    // Handle invalid JSON
                    let response = serde_json::json!({
                        "type": "error",
                        "data": {
                            "message": "Invalid JSON message",
                            "timestamp": chrono::Utc::now().to_rfc3339()
                        }
                    });
                    ctx.text(response.to_string());
                }
            }
            Ok(ws::Message::Binary(_)) => {
                // We don't handle binary messages
                let response = serde_json::json!({
                    "type": "error",
                    "data": {
                        "message": "Binary messages are not supported",
                        "timestamp": chrono::Utc::now().to_rfc3339()
                    }
                });
                ctx.text(response.to_string());
            }
            Ok(ws::Message::Close(reason)) => {
                ctx.close(reason);
                ctx.stop();
            }
            _ => ctx.stop(),
        }
    }
}

impl TerraFusionWebSocket {
    fn new() -> Self {
        Self {
            hb: Instant::now(),
            user_id: None,
        }
    }

    fn with_user_id(user_id: String) -> Self {
        Self {
            hb: Instant::now(),
            user_id: Some(user_id),
        }
    }

    /// Helper method that sends ping to client every 5 seconds (HEARTBEAT_INTERVAL).
    /// Also checks if we have not received a ping/pong from client for more than 10 seconds (CLIENT_TIMEOUT).
    fn hb(&self, ctx: &mut ws::WebsocketContext<Self>) {
        ctx.run_interval(HEARTBEAT_INTERVAL, |act, ctx| {
            // Check if client has responded within the timeout
            if Instant::now().duration_since(act.hb) > CLIENT_TIMEOUT {
                println!("WebSocket Client heartbeat failed, disconnecting!");
                ctx.stop();
                return;
            }
            
            // Send a ping to the client
            ctx.ping(b"");
        });
    }
}

/// WebSocket handshake and start actor
pub async fn websocket_route(req: HttpRequest, stream: web::Payload) -> Result<HttpResponse, Error> {
    // Extract optional user_id from query params
    let query = req.query_string();
    let user_id = req
        .uri()
        .query()
        .and_then(|q| {
            q.split('&')
                .find(|s| s.starts_with("user_id="))
                .map(|s| s.split('=').nth(1).unwrap_or("").to_string())
        });
    
    // Create WebSocket actor with or without user_id
    let ws = if let Some(user_id) = user_id {
        if !user_id.is_empty() {
            TerraFusionWebSocket::with_user_id(user_id)
        } else {
            TerraFusionWebSocket::new()
        }
    } else {
        TerraFusionWebSocket::new()
    };
    
    // Start the WebSocket actor and return the response
    println!("WebSocket connection established!");
    let resp = ws::start(ws, &req, stream)?;
    Ok(resp)
}

// Function to register the WebSocket route
pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("/ws", web::get().to(websocket_route));
}