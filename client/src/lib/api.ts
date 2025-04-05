import { apiRequest } from './queryClient';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  [key: string]: any;
}

export async function ftpConnect(host: string, port: number, user: string, password: string, secure: boolean): Promise<ApiResponse> {
  const res = await apiRequest('POST', '/api/ftp/connect', {
    host,
    port,
    user,
    password,
    secure
  });
  return await res.json();
}

export async function ftpDisconnect(): Promise<ApiResponse> {
  const res = await apiRequest('POST', '/api/ftp/disconnect');
  return await res.json();
}

export async function ftpStatus(): Promise<ApiResponse> {
  const res = await apiRequest('GET', '/api/ftp/status');
  return await res.json();
}

export async function ftpListFiles(path: string): Promise<ApiResponse> {
  const res = await apiRequest('GET', `/api/ftp/files?path=${encodeURIComponent(path)}`);
  return await res.json();
}

export async function ftpCreateDirectory(path: string): Promise<ApiResponse> {
  const res = await apiRequest('POST', '/api/ftp/directory', { path });
  return await res.json();
}

export async function ftpDeleteFile(path: string): Promise<ApiResponse> {
  const res = await apiRequest('DELETE', '/api/ftp/files', { path });
  return await res.json();
}

export async function ftpRenameFile(oldPath: string, newPath: string): Promise<ApiResponse> {
  const res = await apiRequest('PUT', '/api/ftp/files', { oldPath, newPath });
  return await res.json();
}