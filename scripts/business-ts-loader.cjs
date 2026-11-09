const ts = require('typescript');
module.exports = function(source) {
  return ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, jsxImportSource: this.resourcePath.includes('components') && this.resourcePath.includes('business') ? require('path').resolve(__dirname,'../lib/business/localized-jsx').replace(/\\/g,'/') : undefined, esModuleInterop: true }, fileName: this.resourcePath }).outputText;
};
