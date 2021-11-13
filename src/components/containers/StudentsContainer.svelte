<script>
  import { onDestroy, onMount } from "svelte";
  import { fade } from 'svelte/transition';
  import StudentsCard from "../interface/StudentsCard.svelte";
  const io = require("socket.io-client");
  const socket = io("http://127.0.0.1:14500");
  export let searchValue, selectedProfile;
  let StudentData, indices, currentIndex;

  onMount(() => {
    socket.emit("studentDocumentCountGet");
  });

  onDestroy(() => {
    socket.disconnect();
    StudentData = undefined;
    indices = undefined;
    searchValue = "";
    currentIndex = undefined;
  });

  socket.on("studentDocumentRetrieveList", value => {
    try {
      indices = value;
      currentIndex = 1;
      socket.emit("studentDataGet");
    } catch {
      value = undefined;
    }
  });

  socket.on("studentDataRetrieveList", list => {
    try {
      StudentData = list;
    } catch {
      list = undefined;
    }
  });

  // socket.on("studentDataInsert", insert => {
  //   try {
  //     StudentData = [...StudentData, insert];
  //   } catch {
  //     insert = undefined;
  //   }
  // });

  socket.on("studentDataUpdate", update => {
    try {
      StudentData.forEach(Student => {
        if (Student._id == update._id) {
          Student.Name.First = update.Name.First;
          Student.Name.Last = update.Name.Last;
          Student.Student.Course = update.Student.Course;
          Student.Student.Year = update.Student.Year;
          Student.Student.Section = update.Student.Section;
          Student.LoggedIn = update.LoggedIn;
        }
      });
      StudentData = StudentData;
    } catch {
      update = undefined;
    }
  });

  socket.on("studentDataDelete", deleted => {
    try {
      const updateStudentData = StudentData.filter(Student => {
        return Student._id != deleted;
      })
      StudentData = updateStudentData;
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
      ? socket.emit("studentDataGet", currentIndex)
      : socket.emit("studentDataGet", currentIndex - 1);
  } else {
    currentIndex = 1;
  }
</script>

<div class="cards">
  {#if StudentData}
    {#each StudentData as Student (Student._id)}
      <StudentsCard {Student} bind:selectedProfile />
    {/each}
  {:else if StudentData == "Error"}
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