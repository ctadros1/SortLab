interface Env {
  ASSETS: Fetcher
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/') {
      return Response.redirect(new URL('/sortlab/', url), 302)
    }

    if (url.pathname === '/sortlab') {
      return Response.redirect(new URL('/sortlab/', url), 308)
    }

    return env.ASSETS.fetch(request)
  },
}
