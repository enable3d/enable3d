// https://gist.github.com/deebloo/2361d7f9565844f666719a3bc9020561#file-inline-worker-example-js

const InlineWebWorker = (fn: (e: { data: any }) => void) => {
  var blob = new Blob(['self.onmessage = ', fn.toString()], { type: 'text/javascript' })
  var url = URL.createObjectURL(blob)

  return new Worker(url, { type: 'module' })
}

export { InlineWebWorker }
