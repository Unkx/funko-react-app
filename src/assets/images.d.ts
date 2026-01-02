// src/images.d.ts
declare module '*.png' {
  const pngValue: string;
  export default pngValue;
}
declare module '*.jpg' {
  const jpgValue: string;
  export default jpgValue;
}
declare module '*.svg' {
  const svgValue: string;
  export default svgValue;
}

declare module '*.svg?react' {
  import * as React from 'react';
  const svgReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default svgReactComponent;
}
