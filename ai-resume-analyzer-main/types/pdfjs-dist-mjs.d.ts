/** Vite resolves the pdf.js browser bundle from this path; typings omit it upstream. */
declare module "pdfjs-dist/build/pdf.mjs" {
  import * as pdfjs from "pdfjs-dist";
  export = pdfjs;
}
