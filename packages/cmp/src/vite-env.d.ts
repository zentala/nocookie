/** Vite raw import support: `import css from './file.css?raw'` */
declare module "*.css?raw" {
  const content: string;
  export default content;
}
