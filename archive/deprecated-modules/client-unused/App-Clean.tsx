import { Route, Switch } from 'wouter'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import TerraFusionDashboard from './pages/TerraFusionDashboard'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        <Switch>
          <Route path="/" component={TerraFusionDashboard} />
          <Route path="/dashboard" component={TerraFusionDashboard} />
          <Route>
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">TerraFusion</h1>
                <p className="text-gray-600 mb-6">Civil Infrastructure Intelligence Platform</p>
                <a 
                  href="/" 
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Go to Dashboard
                </a>
              </div>
            </div>
          </Route>
        </Switch>
      </div>
    </QueryClientProvider>
  )
}

export default App