import type { Route } from "./+types/home";
import { CrossLangEdit } from "../welcome/CrossLangEdit";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "CrossLangEdit - 跨语言编辑工具" },
    { name: "description", content: "简单的跨语音编辑小程序，监听剪切板进行翻译" },
  ];
}

export default function Home() {
  return <CrossLangEdit />;
}
