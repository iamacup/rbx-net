import React from "react";
import clsx from "clsx";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import useBaseUrl from "@docusaurus/useBaseUrl";
import styles from "./styles.module.css";
import CodeBlock from "@theme/CodeBlock";
import Tabs from "@theme/Tabs";
import TabItem from "@theme/TabItem";
import Code from "@site/src/components/Code";

const features = [
  {
    title: "Simplified Networking & Contextual API",
    // imageUrl: 'img/undraw_docusaurus_mountain.svg',
    description: (
      <>
        Remotes are managed entirely by Net. All you need are identifiers. The
        API is built to make things more simple and easy to follow as well. <br/><br/>
        <code>Server</code> objects are explicitly for the server, while{" "}
        <code>Client</code> objects are explicitly for the client
      </>
    ),
  },
  {
    title: "Powered by roblox-ts",
    // imageUrl: 'img/undraw_docusaurus_tree.svg',
    description: (
      <>
        Takes leverage of the feature set of roblox-ts, including <code>asynchronous</code> methods.
      </>
    ),
  },
  {
    title: "Powerful Extensions",
    // imageUrl: 'img/undraw_docusaurus_react.svg',
    description: (
      <>
        <Link to="/docs/1.3.x/type-safety">Type Safety</Link>,{" "}
        <Link to="/docs/1.3.x/caching">Caching</Link> and{" "}
        <Link to="/docs/1.3.x/throttling">Throttling</Link> are examples of features available in RbxNet.
      </>
    ),
  },
];

function Feature({ imageUrl, title, description }) {
  const imgUrl = useBaseUrl(imageUrl);
  return (
    <div className={clsx("col col--4", styles.feature)}>
      {imgUrl && (
        <div className="text--center">
          <img className={styles.featureImage} src={imgUrl} alt={title} />
        </div>
      )}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

const EXAMPLE_CODE_TS = `import Net from "@rbxts/net";
const TestIdRemote = new Net.Server.Event("TestId");
TestIdRemote.Connect((message: string) => {

})`;
const EXAMPLE_CODE_LUA = `local Net = require(game:GetService("ReplicatedStorage").Net)
local TestIdRemote = Net.Server.Event.new("TestId")
TestIdRemote:Connect(function()
end)`;

function Home() {
  const context = useDocusaurusContext();
  const { siteConfig = {} } = context;
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Description will go into a meta tag in <head />"
    >
      <header className={clsx("hero", styles.heroBanner)}>
        <div className="container">
          <img src={useBaseUrl("img/net2.svg")} />
          <h1 className="hero__title">{siteConfig.title}</h1>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
          <div className={styles.buttons}>
            <Link
              className={clsx(
                "button button--outline button--primary button--lg",
                styles.getStarted
              )}
              to={useBaseUrl("docs/1.3.x")}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>
      <main>
        {features && features.length > 0 && (
          <section className={styles.features}>
            <div className="container">
              <div className="row">
                {features.map((props, idx) => (
                  <Feature key={idx} {...props} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </Layout>
  );
}

export default Home;
