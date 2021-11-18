<script>
  import { onDestroy } from "svelte";
  import { fly, fade } from "svelte/transition";
  import FormAddPage1 from "./interface/FormAddPage1.svelte";
  import FormAddPage2 from "./interface/FormAddPage2.svelte";
  import FormAddPage3 from "./interface/FormAddPage3.svelte";
  import FormAddPage4 from "./interface/FormAddPage4.svelte";
  import FormCompletePage from "./interface/FormCompletePage.svelte";
  const io = require("socket.io-client");
  const socket = io("http://127.0.0.1:14500");
  export let addPressed, tabIndex;
  let completed = 0;
  let UserData = {};
  let cancelPressed = false;
  let incomplete = false;

  switch (tabIndex) {
    case 0:
      UserData = {
        Name: {
          First: "",
          Last: "",
        },
        Student: {
          Course: "",
          Year: "",
          Section: "",
        },
        Images: {
          First: "",
          Second: "",
        },
        LoggedIn: false,
      }
      break;
    case 1:
      UserData = {
        Name: {
          First: "",
          Last: "",
        },
        Images: {
          First: "",
          Second: "",
        },
        Occupation: "",
        LoggedIn: "",
      }
      break;
    }

  function closePanel() {
    cancelPressed = !cancelPressed;
  }

  function closeConfirm() {
    addPressed = !addPressed;
  }

  function next() {
    incomplete = true;
    if (completed == 1 && (UserData.Name.First == "" || UserData.Name.Last == ""))
      completed = 1;
    else if (completed == 2 && tabIndex == 0 && (UserData.Student.Course == "" || UserData.Student.Year == "" || UserData.Student.Section == ""))
      completed = 2;
    else if (completed == 2 && tabIndex == 1 && (UserData.Occupation == ""))
      completed = 2;
    else if (!(completed >= 3))
      completed += 1;
  }

  function previous() {
    cancelPressed = false;
    if (!(completed <= 0)) completed -= 1;
    if (completed == 0) incomplete = false;
  }

  function finish() {
    if (completed == 3 && (UserData.Images.First != "" || UserData.Images.Second != "")) {
      switch (tabIndex) {
        case 0:
          socket.emit("studentDataPostRequest", UserData);
          break;
        case 1:
          socket.emit("employeeDataPostRequest", UserData);
          break;
      }
    } else {
      completed = 3;
      return;
    }
    completed = 4;
  }

  socket.on("userDataPostStatus", confirmation => {
    setTimeout(() => {
      switch (confirmation) {
        case 0: // False or Fail
          completed = 6;
          break;
        case 1: // True or Success
          completed = 5;
          break;
      }
    }, 1000);
  });

  onDestroy(() => {
    UserData, completed, cancelPressed, incomplete = undefined;
    socket.disconnect();
  });
</script>

<div class="container" in:fade="{{ duration: 200 }}" out:fade="{{delay: 250, duration: 200 }}">
  <div class="forms" in:fly={{ delay: 250, y: 500, duration: 200 }} out:fly="{{y: 50,  duration: 200 }}">
    <section class="top-button">
    {#if completed < 4}
      {#if !cancelPressed}
        <button on:click={closePanel}>Cancel</button>
      {:else if cancelPressed}
        <p>Are you sure?</p>
        <button class="yes-button" on:click={closeConfirm}>Yes</button>
        <button class="no-button" on:click={closePanel}>No</button>
      {/if}
    {/if}
    </section>
    <section class="middle-content">
      {#if completed == 0}
        <FormAddPage1 {tabIndex} />
      {:else if completed == 1}
        <FormAddPage2 {tabIndex} bind:incomplete bind:UserData />
      {:else if completed == 2}
        <FormAddPage3 {tabIndex} bind:incomplete bind:UserData />
      {:else if completed == 3}
        <FormAddPage4 bind:incomplete bind:UserData />
      {:else if completed >= 4}
        <FormCompletePage {completed} />
      {/if}
    </section>
    <section class="bottom-button">
      {#if completed < 4}
        <button on:click={previous} disabled={completed <= 0}>Back</button>
        <div class="tab-indicator">
          <div class="tab-index" class:completed="{completed >= 0}"></div>
          <div class="tab-index" class:completed="{completed >= 1}"></div>
          <div class="tab-index" class:completed="{completed >= 2}"></div>
          <div class="tab-index" class:completed="{completed >= 3}"></div>
        </div>
        {#if completed < 3}
          <button disabled={incomplete} on:click={next}>Next</button>
        {:else}
          <button disabled={incomplete} on:click={finish}>Finish</button>
        {/if}
      {:else}
        <div style="width: 100%; display:flex; justify-content: center;">
          <button disabled={completed == 4} on:click={closeConfirm}>Close</button>
        </div>
      {/if}
    </section>
  </div>
</div>

<style>
  div.container {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    width: 100vw;
    height: 100vh;
    top: 0;
    left: 0;
    position: absolute;
    background-color: rgba(0, 0, 0, 0.35);
    z-index: 20;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }
  div.forms {
    border-radius: 10px;
    height: 425px;
    width: 550px;
    background-color: #EFEFEF;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
    padding: 25px;
    display: grid;
    grid-template-rows: auto 1fr auto;
  }
  button {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    transition: ease-in-out 100ms;
    width: 85px;
    height: 30px;
    font-size: 18px;
    border: none;
    border-radius: 10px;
    background-color: #efefef;
    font-weight: 350;
  }
  button:hover {
    transition: ease-in-out 100ms;
    transition: box-shadow 100ms ease-in-out;
    color: #63b9db;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
  }
  button:active {
    box-shadow: inset 0px 4px 4px rgba(0, 0, 0, 0.1);
    color: #63b9db;
  }
  button:disabled {
    color: lightgray;
    box-shadow: inset 0px 4px 4px rgba(0, 0, 0, 0.1);
  }
  button.no-button:hover,
  button.no-button:active {
    color: #e6c2bf;
  }
  section.top-button {
    width: 100%;
    height: auto;
    display: flex;
    align-items: center;
  }
  section.top-button button,
  section.top-button p {
    margin-right: 15px;
  }
  section.top-button p {
    font-size: 20px;
    font-weight: 400;
  }
  section.bottom-button {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  div.tab-indicator {
    display: flex;
    justify-content: space-around;
  }
  div.tab-index {
    transition: ease-in-out 100ms;
    transition: box-shadow 100ms ease-in-out;
    width: 25px;
    height: 10px;
    margin: 0 15px;
    border-radius: 50px;
    box-shadow: inset 0px 4px 4px rgba(0, 0, 0, 0.1);
  }
  div.tab-index.completed {
    background: #63b9db;
    transition: ease-in-out 100ms;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
  }
</style>