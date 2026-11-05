// Page titles read "e7lang - <page>" (the site name first); the homepage is "e7lang - <tagline>".
import React from "react";
import { TitleFormatterProvider } from "@docusaurus/theme-common/internal";

const formatter = ({ title, siteTitle }) => {
  const t = (title || "").trim();
  return t && t !== siteTitle ? `${siteTitle} - ${t}` : siteTitle;
};

export default function ThemeProviderTitleFormatter({ children }) {
  return <TitleFormatterProvider formatter={formatter}>{children}</TitleFormatterProvider>;
}
