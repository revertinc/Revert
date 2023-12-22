<p align="center">
<img width="150" style="border-radius:75px;" src="https://res.cloudinary.com/dfcnic8wq/image/upload/v1673932396/Revert/Revert_logo_x5ysgh.png"/>
<h1 align="center"><b>Revert</b></h1>
<p align="center">
Open-source unified API for product integrations 
<br />
</p>

# @revertdotdev/revert-react

## Overview

Revert is the fastest way to integrate with your customer's tools with a single set of APIs & SDKs.

This package contains the React sdk with the following:

1. `RevertConnect` component
2. `useRevertConnect` hook

### Getting Started

First, install the Revert npm package:

```javascript
yarn add @revertdotdev/revert-react
```

### Usage

1. Adding the `<RevertConnect>` component will instantly give your app a way for your users to connect their tools by opening our Modal on clicking where they will be a able to choose & connect their 3rd party tool.

```javascript
function App() {
    return (
        <Wrapper>
            <RevertConnect
                config={{
                    revertToken: 'YOUR_PUBLIC_TOKEN',
                    tenantId: 'CUSTOMER_TENANT_ID',
                }}
            />
        </Wrapper>
    );
}
```

2. If you wish to use your own UI for it you can use the `useRevertConnnect` hook and call the `open()` method when appropriate. For example:

```javascript
const { loading, error, open } = useRevertConnect({ config: configObject });
return (
    <button
        disabled={loading || Boolean(error)}
        id="revert-connect-button"
        onClick={() => open()}
        style={{
            padding: 10,
            outline: 'none',
            background: 'rgb(39, 45, 192)',
            border: '1px solid rgb(39, 45, 192)',
            borderRadius: 5,
            cursor: 'pointer',
            color: '#fff',
            ...props.style,
        }}
    >
        {props.children || 'Connect your tool'}
    </button>
);
```

You can also pass in the `integrationId` inside the `open()` method above to directly open the integration you are interested in. These are the integration IDs that are currently supported:

-   `open('hubspot')`
-   `open('zohocrm')`
-   `open('sfdc')`

### Support

In case of questions/feedback, you can get in touch in the following ways

-   Open a Github support issue
-   Contact us over [email](mailto:jatin@revert.dev).
