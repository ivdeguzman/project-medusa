<script>
  const { ipcRenderer } = require("electron");
  import { raspberryConnected, destroyComponent } from "../stores/ui";
  import { fade } from "svelte/transition";
  function shutdownPrompt() {
    ipcRenderer.send("shutdown-prompt");
  }
  function minimizeWindow() {
    ipcRenderer.send("minimize-window");
  }
  function maximizeWindow() {
    ipcRenderer.send("maximize-window");
  }
  
  ipcRenderer.on("raspberry-is-online", (event, res) => {
    if (res == true) {
      raspberryConnected.set(true);
    } else {
      raspberryConnected.set(false);
    }
  });

  let easterEgg = () => {
    document.getElementById("rickroll").click();
  }
</script>

<section style="-webkit-app-region: drag; background: #242424;" class="z-50 flex flex-col w-14 justify-between align-center">
  {#if $destroyComponent == true}
    <div in:fade="{{ duration: 200 }}">
      <!-- Close Button-->
      <button on:click={shutdownPrompt} class="w-full h-14 flex justify-center items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 16 16"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M13.854 2.146a.5.5 0 0 1 0 .708l-11 11a.5.5 0 0 1-.708-.708l11-11a.5.5 0 0 1 .708 0Z"
          />
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M2.146 2.146a.5.5 0 0 0 0 .708l11 11a.5.5 0 0 0 .708-.708l-11-11a.5.5 0 0 0-.708 0Z"
          />
        </svg>
      </button>
      <!-- Maximize Button -->
      <button on:click={maximizeWindow} class="w-full h-14 flex justify-center items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 16 16"
        >
          <path
            d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z"
          />
        </svg>
      </button>
      <!-- Minimize Button -->
      <button on:click={minimizeWindow} class="w-full h-14 flex justify-center items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 16 16"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M2 8a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 8Z"
          />
        </svg>
      </button>
    </div>
    <a href="https://youtu.be/o-YBDTqX_ZU" class="hidden" id="rickroll">Rickroll</a>
    <div in:fade="{{ delay: 400, duration: 200 }}" class="w-14 h-14 flex justify-center items-center bg-transparent">
      <div on:click={easterEgg} class="status-icon h-5 w-5 rounded-full" class:connected={$raspberryConnected} class:disconnected={!$raspberryConnected} title={$raspberryConnected ? "Device connected" : "Device not connected"} />
    </div>
  {/if}
</section>

<style>
  svg {
    background: #242424;
    fill: #efefef;
    transition: 150ms ease-in-out;
  }
  button {
    -webkit-app-region: no-drag;
    transition: 150ms ease-in-out;
    background: #242424;
  }
  button:hover,
  button:active {
    background: #63b9db;
  }
  button:hover svg,
  button:active svg {
    background: #63b9db;
    fill: #242424;
  }
  button:first-of-type:hover,
  button:first-of-type:active {
    background: #e6c2bf;
  }
  button:first-of-type:hover svg,
  button:first-of-type:active svg {
    background: #e6c2bf;
    fill: #242424;
  }
  div.status-icon {
    -webkit-app-region: no-drag;
    transition: 150ms ease-in-out;
  }
  div.disconnected {
    background-color: #e6c2bf;
  }
  div.connected {
    background-color: #63b9db;
  }
</style>