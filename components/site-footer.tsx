import styles from "./site-footer.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <p className={styles.note}>
        Built with{" "}
        <a href="https://cursor.com/docs/sdk/typescript" target="_blank" rel="noreferrer">
          @cursor/sdk
        </a>{" "}
        — cloud agents, streaming, multi-turn editing.
      </p>
      <div className={styles.links}>
        <a href="https://github.com/AppleLamps/cursor-sdk-web" target="_blank" rel="noreferrer">
          Source
        </a>
        <a href="https://github.com/AppleLamps/cursor-sdk-web-template" target="_blank" rel="noreferrer">
          Template repo
        </a>
        <a href="https://cursor.com/blog/typescript-sdk" target="_blank" rel="noreferrer">
          SDK blog
        </a>
      </div>
    </footer>
  );
}
