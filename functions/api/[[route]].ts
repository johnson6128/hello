export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url)
  const workerUrl = `https://hello-todo.jamkline03.workers.dev${url.pathname}${url.search}`
  return fetch(new Request(workerUrl, context.request))
}
