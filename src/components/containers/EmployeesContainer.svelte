<script>
  import { onDestroy, onMount } from "svelte";
  import { fade } from 'svelte/transition';
  import EmployeesCard from "../interface/EmployeesCard.svelte";
  const io = require("socket.io-client");
  const socket = io("http://127.0.0.1:14500");
  export let searchValue, selectedProfile;
  let EmployeeData, indices, currentIndex;

  onMount(() => {
    socket.emit("employeeDocumentCountGet");
  });

  onDestroy(() => {
    socket.disconnect();
    EmployeeData = undefined;
    indices = undefined;
    searchValue = "";
    currentIndex = undefined;
  });

  socket.on("employeeDocumentRetrieveList", value => {
    try {
      indices = value;
      currentIndex = 1;
      socket.emit("employeeDataGet");
    } catch {
      value = undefined;
    }
  });

  socket.on("employeeDataRetrieveList", list => {
    try {
      EmployeeData = list;
    } catch {
      list = undefined;
    }
  });

  // socket.on("employeeDataInsert", insert => {
  //   try {
  //     EmployeeData = [...EmployeeData, insert];
  //   } catch {
  //     insert = undefined;
  //   }
  // });

  socket.on("employeeDataUpdate", update => {
    try {
      EmployeeData.forEach(Employee => {
        if (Employee._id == update._id) {
          Employee.Name.First = update.Name.First;
          Employee.Name.Last = update.Name.Last;
          Employee.Occupation = update.Occupation;
          Employee.LoggedIn = update.LoggedIn;
        }
      });
      EmployeeData = EmployeeData;
    } catch {
      update = undefined;
    }
  });

  socket.on("employeeDataDelete", deleted => {
    try {
      const updateEmployeeData = EmployeeData.filter(Employee => {
        return Employee._id != deleted;
      });
      EmployeeData = updateEmployeeData;
    } catch {
      deleted = undefined;
    }
  });
  
  let subtract = () => {
    currentIndex != 1 && currentIndex != 0 ? currentIndex-- : currentIndex;
  }

  let add = () => {
    currentIndex != indices ? currentIndex++ : currentIndex;
  }

  $: if (currentIndex <= indices) {
    currentIndex == "" || currentIndex == 0
      ? socket.emit("employeeDataGet", currentIndex)
      : socket.emit("employeeDataGet", currentIndex - 1);
  } else {
    currentIndex = 1;
  }
</script>

<div class="cards">
  {#if EmployeeData}
    {#each EmployeeData as Employee (Employee._id)}
      <EmployeesCard {Employee} bind:selectedProfile />
    {/each}
  {:else if EmployeeData == "Error"}
    <p>There is a problem with your request.</p>
  {/if}
</div>
{#if indices}
  <div class="index" in:fade={{ delay: 500, duration: 250 }} out:fade={{ duration: 200 }}>
    <button disabled={currentIndex == 1 || currentIndex == 0} on:click={subtract}>Back</button>
    <input type="text" bind:value={currentIndex}>
    <button disabled={currentIndex == indices} on:click={add}>Next</button>
  </div>
{/if}

<style>
  div.cards {
    height: auto;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-flow: column wrap;
  }
  div.index {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    justify-content: center;
    margin-top: 16px;
  }
  div.index button {
    border: none;
    margin: 10px;
    height: 24px;
    width: 50px;
    border-radius: 50px;
    transition: 100ms ease-in-out;
    font-family: inherit;
  }
  div.index button:hover {
    color: #63b9db;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
  }
  div.index button:disabled {
    color: lightgray;
    box-shadow: inset 0px 4px 4px rgba(0, 0, 0, 0.1);
  }
  div.index input {
    height: 28px;
    width: 75px;
    text-align: center;
    font-size: 15px;
    font-family: inherit;
    background: transparent;
    border-radius: 50px;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
    border: none;
  }
</style>