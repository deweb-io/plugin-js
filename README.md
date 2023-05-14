![](https://badgen.net/badge/Editor.js/v2.0/blue)

# plugin Tool

plugin Block for the [Editor.js](https://codex.so/editor).

![](assets/gif/demo.gif)

## Features

Allows adding link previews to your articles.
using pre defined external domain endpoints which are recognized onPaste.

**Note:** this Tool requires server-side implementation for link data fetching. See [backend response format](#server-format) for more details.

## Installation

### Install via NPM

Get the package

```shell
npm i --save-dev @dewebio/plugin-js
```

Include module at your application

```javascript
const LinkTool = require('@dewebio/plugin-js');
```

### Download to your project's source dir

1. Download folder `dist` from repository
2. Add `dist/bundle.js` file to your page.


## Usage

Add a new Tool to the `tools` property of the Editor.js initial config.

```javascript
const editor = EditorJS({
  ...

  tools: {
    ...
    plugin: {
      class: PluginTool,
      config: {
                endpoint: linkToolEndpoint,
                pluginEndpoints: pluginsValidEndpoints
            }
    }
  },

  ...
});
```

## Config Params

Link Tool supports these configuration parameters:

| Field           | Type        | Description                                        |
| ----------------|-------------|----------------------------------------------------|
| endpoint        | `string`    | **Required:** the endpoint for link data fetching. |
| pluginEndpoints | `string`    | **optional:** string array of plugin endpoints.    |

## Output data

This Tool returns `data` with following format

| Field          | Type      | Description                     |
| -------------- | --------- | ------------------------------- |
| link           | `string`  | Pasted link's url               |
| meta           | `object`  | Fetched link's data. Any data got from the backend. Currently, the plugin's design supports the 'title', 'image', and 'description' fields. |

```json
{
    "type" : "linkTool",
    "data" : {
        "link" : "https://codex.so",
        "meta" : {
            "title" : "CodeX Team",
            "site_name" : "CodeX",
            "description" : "Club of web-development, design and marketing. We build team learning how to build full-valued projects on the world market.",
            "image" : {
                "url" : "https://codex.so/public/app/img/meta_img.png"
            }
        }
    }
}
```

## Backend response format <a name="server-format"></a>

You can implement a backend for link data fetching your own way. It is a specific and trivial task depending on your
environment and stack.

Backend response **should** cover following format:

```json5
{
    "success" : 1,
    "meta": {
        // ... any fields you want
    }
}
```

**success** — uploading status. 1 for successful, 0 for failed

**meta** — link fetched data.

Currently, the plugin's design supports the 'title', 'image', and 'description' fields. They should have the following format in the response:

```json5
{
    "success" : 1,
    "meta": {
        "title" : "CodeX Team",
        "description" : "Club of web-development, design and marketing. We build team learning how to build full-valued projects on the world market.",
        "image" : {
            "url" : "https://codex.so/public/app/img/meta_img.png"
        }
    }
}
```

Also, it can contain any additional fields you want to store.
