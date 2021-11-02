<script>
  import { fly } from 'svelte/transition';
  const { ipcRenderer } = require("electron");
  export let tabIndex;

  function shutdownPrompt() {
    ipcRenderer.send("shutdown-prompt");
  }
  function minimizeWindow() {
    ipcRenderer.send("minimize-window");
  }
  function maximizeWindow() {
    ipcRenderer.send("maximize-window");
  }
  function studentsTab() {
    tabIndex = 0;
    console.log(tabIndex);
  }
  function employeesTab() {
    tabIndex = 1;
    console.log(tabIndex);
  }
  function logbookTab() {
    tabIndex = 2;
    console.log(tabIndex);
  }
</script>

<div transition:fly={{ y: -50, duration: 250 }} class="titlebar" style="-webkit-app-region: drag">
  <!-- UI Button Left | Start -->
  <div class="button control">
    <!-- Close Button-->
    <button on:click={shutdownPrompt}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        class="bi bi-x-lg"
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
    <!-- Minimize Button -->
    <button on:click={minimizeWindow}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        class="bi bi-dash-lg"
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
  <!-- UI Button Left | End -->

  <!-- UI Button Center | Start -->
  <div class="button tab">
    <button class:active="{tabIndex === 0}" id="studentsTab" on:click={studentsTab}>Students</button>
    <button class:active="{tabIndex === 1}" id="employeesTab" on:click={employeesTab}>Employees</button>
    <button class:active="{tabIndex === 2}" id="logbookTab" on:click={logbookTab}>Logbook</button>
  </div>
  <!-- UI Button Center | End -->

  <!-- UI Button Right | Start -->
  <div class="button control">
    <!-- Maximize Button -->
    <button on:click={maximizeWindow}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        class="bi bi-fullscreen"
        viewBox="0 0 16 16"
      >
        <path
          d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z"
        />
      </svg>
    </button>
  </div>
  <!-- UI Button Right | End -->
</div>

<style>
  .titlebar {
    width: 100vw;
    height: 65px;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.025);
    border-radius: 10px 10px 0px 0px;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    background: #efefef;
    z-index: 10;
  }
  .button {
    display: flex;
  }
  .button button {
    -webkit-app-region: no-drag;
    display: grid;
    place-items: center;
    margin: 0 7px;
    border: none;
    background: none;
    transition: ease-in-out 100ms;
  }
  .button button:hover,
  .button.tab button.active {
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
    border-radius: 10px;
  }
  .button button:hover {
    fill: #63b9db;
    color: #63b9db;
  }
  .button button:active,
  .button.tab button.active:active {
    box-shadow: inset 0px 4px 4px rgba(0, 0, 0, 0.1);
    border-radius: 10px;
  }
  .button.control:first-child {
    display: flex;
    justify-content: flex-start;
    margin-left: 15px;
  }
  .button.control:last-child {
    display: flex;
    justify-content: flex-end;
    margin-right: 15px;
  }
  .button.control button {
    width: 40px;
    height: 40px;
    border-radius: 50px;
  }
  .button.control button svg {
    width: 17.5px;
    height: 17.5px;
  }
  .button.tab {
    display: flex;
    justify-content: center;
  }
  .button.tab button {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    font-size: 22px;
    width: 125px;
    height: 40px;
    border-radius: 10px;
    font-weight: 350;
  }
</style>