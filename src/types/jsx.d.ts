/// <reference types="solid-js" />
import type { JSX as SolidJSX } from "solid-js";

declare global {
  namespace JSX {
    interface IntrinsicElements extends SolidJSX.IntrinsicElements {}
  }
}