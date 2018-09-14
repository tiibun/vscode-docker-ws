# Docker FileSystem Extension for Visual Studio Code

This extension makes enabled to add folder inside a **running** docker using [FileSystemProvider API](https://code.visualstudio.com/docs/extensionAPI/vscode-api#FileSystemProvider) to workspace.

Sorry, this is for **Linux Container Only**.

## Feature

### Add Folder in Docker to Workspace

Run a docker container.  
Select Command Pallet[F1] -> `dockerws: Add Folder to Workspace`.  
Next, choose docker container.  
Next, select folder path to open.
Finally docker folder added.

![Preview](https://raw.githubusercontent.com/tiibun/vscode-docker-ws/master/image/preview.gif)

### Save workspace

Menu "Save Workspace As..." saves workspace settings file like:

```json:.code-workspace
{
    "folders": [{
        "uri": "docker://########/",
        "name": ". | centos (*******)"
    }]
}
```

where *########* is the container id.
Uri scheme *"docker"* activates this extension.

You can *Open WorkSpace* this file.

## Installation

In Command Pallet[F1], paste and go following command

```sh
ext install vscode-docker-ws
```

## ToDo...

- Implement [Docker initial settings](https://github.com/apocas/dockerode#getting-started)

## License

MIT
