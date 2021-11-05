<script>
  const { ipcRenderer } = require("electron");
  export let UserData;

  function selectFirst() {
    UserData.Images.First = ipcRenderer.sendSync("select-image");
  }  

  function selectSecond() {
    UserData.Images.Second = ipcRenderer.sendSync("select-image");
  }
</script>

<div class="container">
  <h1>Click one of the circles, add an image.</h1>
  <div class="form">
    {#if UserData.Images.First == ""}
      <svg on:click={selectFirst} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-plus"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
    {:else}
      <img on:click={selectFirst} src="{UserData.Images.First}" alt="First">
    {/if}
    {#if UserData.Images.Second == ""}
      <svg on:click={selectSecond} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-plus"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
    {:else}
      <img on:click={selectFirst} src="{UserData.Images.Second}" alt="Second">
    {/if}
  </div>
</div>

<style>
  div.container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }
  div.form {
    display: flex;
    flex-flow: row nowrap;
    justify-content: center;
    align-items: center;
    width: auto;
  }
  h1 {
    font-size: 27.5px;
    font-weight: 350;
    text-align: center;
  }
  svg, img {
    margin: 10px;
    width: 120px;
    height: 120px;
    stroke-width: 1px;
    border-radius: 100%;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
    stroke: #efefef;
    background-color: #63b9db;
    object-fit: cover;
  }
  svg {
    padding: 20px;
  }
  img {
    width: 160px;
    height: 160px
  }
  svg:hover,
  svg:active,
  img:hover,
  img:active {
    box-shadow: inset 0px 4px 4px rgba(0, 0, 0, 0.1);
  }
</style>