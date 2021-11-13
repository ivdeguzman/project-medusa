<script>
  import { onDestroy } from "svelte";
  import { fly, fade } from "svelte/transition";
  import FormCompletePage from "./interface/FormCompletePage.svelte";
  const io = require("socket.io-client");
  const socket = io("http://127.0.0.1:14500");
  export let editButtonClicked, selectedProfile, tabIndex;
  let updateProcess = false, completed = 0;

  onDestroy(() => {
    updateProcess = undefined;
  });

  let editButtonToggle = () => {
    editButtonClicked = !editButtonClicked;
  }
  let userProfileUpdateRequest = () => {
    updateProcess = true;
    completed = 4;
    switch (tabIndex) {
      case 0:
        socket.emit("studentDataPatchRequest", selectedProfile);
        break;
      case 1:
        socket.emit("employeeDataPatchRequest", selectedProfile);
        break
    }
  }

  socket.on("userDataPatchStatus", status => {
    setTimeout(() => {
      status ? completed = 7 : completed = 6;
    }, 1000);
  });
</script>

<div class="container" in:fade={{ duration: 200 }} out:fade={{delay: 250, duration: 200 }}>
  <div class="forms" in:fly={{ delay: 250, y: 500, duration: 250 }} out:fly="{{y: 50,  duration: 200 }}">
    {#if updateProcess == false}
      <div>
        <section class="design">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-user"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <h1>Edit this person.</h1>
        </section>
        <section class="text-field">
          {#if tabIndex == 0}
            <input bind:value={selectedProfile.Name.First} id="firstname" type="text" placeholder="Enter first name" />
            <input bind:value={selectedProfile.Name.Last} id="lastname" type="text" placeholder="Enter last name" />
            <input bind:value={selectedProfile.Student.Course} type="text" placeholder="Enter student course" />
            <div class="sub-form">
              <input bind:value={selectedProfile.Student.Year} type="text" placeholder="Year" />
              <input bind:value={selectedProfile.Student.Section} type="text">
            </div>
          {:else if tabIndex == 1}
            <input bind:value={selectedProfile.Name.First} type="text" placeholder="Enter first name" />
            <input bind:value={selectedProfile.Name.Last} type="text" placeholder="Enter last name" />
            <input bind:value={selectedProfile.Occupation} type="text" placeholder="Enter employee occupation" />
          {/if}
        </section>
      </div>
      <section class="two-buttons">
        <button on:click={editButtonToggle}>Close</button>
        <button on:click={userProfileUpdateRequest}>Update</button>
      </section>
    {:else if updateProcess == true}
      <FormCompletePage {completed} />
      <button disabled={completed < 5} on:click={editButtonToggle}>Close</button>
    {/if}
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
    display: flex;
    flex-flow: column nowrap;
    justify-content: space-between;
    align-items: center;
  }
  section.text-field {
    display: flex;
    flex-flow: column nowrap;
    justify-content: flex-start;
    align-items: center;
    width: 100%;
    height: auto;
    width: 350px;
    justify-self: center;
  }
  section.two-buttons {
    display: flex;
    justify-content: space-between;
  }
  section.design {
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
  }
  button {
    font-family: inherit;
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
  svg {
    width: 75px;
    height: 75px;
    stroke-width: 1px;
    border-radius: 100%;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
    padding: 20px;
    stroke: #efefef;
    background-color: #63b9db;
  }
  input {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    border: none;
    height: 32px;
    width: 100%;
    background: #efefef;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
    border-radius: 50px;
    font-size: 15px;
    text-align: center;
    margin-top: 10px;
  }
  h1 {
    margin: 5px;
    font-size: 27.5px;
    font-weight: 350;
    text-align: center;
  }
  div.sub-form {
    display: flex;
    flex-flow: row nowrap;
  }
  div.sub-form input:first-child {
    margin-right: 15px;
  }
</style>