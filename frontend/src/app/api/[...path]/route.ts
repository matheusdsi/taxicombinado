import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL?.replace(/\/+$/, '');

function buildProxyHeaders(request: NextRequest) {
  const headers = new Headers(request.headers);

  headers.delete('host');
  headers.delete('connection');
  headers.delete('content-length');
  headers.delete('accept-encoding');
  headers.delete('origin');
  headers.delete('x-forwarded-host');
  headers.delete('x-forwarded-proto');
  headers.delete('x-forwarded-port');

  return headers;
}

async function proxy(request: NextRequest, pathParts: string[]) {
  if (!API_URL) {
    return NextResponse.json(
      { success: false, error: 'API_URL nao configurada no frontend.' },
      { status: 500 }
    );
  }

  const path = pathParts.join('/');
  const search = request.nextUrl.search;
  const targetUrl = `${API_URL}/api/${path}${search}`;
  const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer();

  const response = await fetch(targetUrl, {
    method: request.method,
    headers: buildProxyHeaders(request),
    body,
    redirect: 'manual',
  });

  const headers = new Headers(response.headers);
  headers.delete('content-encoding');
  headers.delete('content-length');

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function GET(request: NextRequest, context: { params: { path: string[] } }) {
  return proxy(request, context.params.path);
}

export async function POST(request: NextRequest, context: { params: { path: string[] } }) {
  return proxy(request, context.params.path);
}

export async function PUT(request: NextRequest, context: { params: { path: string[] } }) {
  return proxy(request, context.params.path);
}

export async function PATCH(request: NextRequest, context: { params: { path: string[] } }) {
  return proxy(request, context.params.path);
}

export async function DELETE(request: NextRequest, context: { params: { path: string[] } }) {
  return proxy(request, context.params.path);
}
