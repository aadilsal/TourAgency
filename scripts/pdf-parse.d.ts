/** Minimal typing for the CommonJS entry the flow harness uses directly. */
declare module "pdf-parse/lib/pdf-parse.js" {
  const pdfParse: (data: Buffer) => Promise<{ text: string; numpages: number }>;
  export default pdfParse;
}
