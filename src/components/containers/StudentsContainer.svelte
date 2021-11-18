<script>
  import { onDestroy, onMount } from "svelte";
  import { fade } from 'svelte/transition';
  import StudentsCard from "../interface/StudentsCard.svelte";
  const io = require("socket.io-client");
  const socket = io("http://127.0.0.1:14500");
  export let searchValue, selectedProfile, currentIndex;
  let StudentData, indices, navButton = true;

  onMount(() => {
    socket.emit("studentDocumentCountGet");
  });

  onDestroy(() => {
    socket.disconnect();
    StudentData = undefined;
    indices = undefined;
    searchValue = "";
  });

  socket.on("studentDocumentRetrieveList", value => {
    try {
      indices = value;
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
    socket.emit("studentDataGet", currentIndex - 1);
  }

  let add = () => {
    currentIndex != indices ? currentIndex++ : currentIndex;
    socket.emit("studentDataGet", currentIndex - 1);
  }

  $: socket.emit("searchQuery", searchValue, "student");

  $: if (!searchValue) {
    navButton = true;
    socket.emit("studentDataGet", currentIndex - 1)
  }

  socket.on("searchResults", arrayResults => {
    StudentData = arrayResults;
    navButton = false;
  });
</script>

<div class="cards">
  {#if StudentData}
    {#each StudentData as Student (Student._id)}
      <StudentsCard {indices} {Student} bind:selectedProfile />
    {/each}
  {:else if StudentData == "Error"}
    <p>There is a problem with your request.</p>
  {/if}
</div>
{#if indices && navButton}
  <div class="index" in:fade={{ delay: 500, duration: 200 }} out:fade={{ duration: 200 }}>
    <button disabled={currentIndex == 1 || currentIndex == 0 || typeof currentIndex == "string"} on:click={subtract}>Back</button>
    <p>{currentIndex} out of {indices}</p>
    <button disabled={currentIndex == indices || typeof currentIndex == "string"} on:click={add}>Next</button>
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
    margin-bottom: 32px;
    position: fixed;
    width: 100vw;
    bottom: 0;
    left: 0;
  }
  div.index button {
    border: none;
    margin: 10px;
    height: 24px;
    width: 50px;
    border-radius: 50px;
    transition: 100ms ease-in-out;
    font-family: inherit;
    background: #efefef;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
  }
  div.index button:hover {
    color: #63b9db;
    box-shadow: inset 0px 4px 4px rgba(0, 0, 0, 0.1);
    transition: 100ms ease-in-out;
  }
  div.index button:active {
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
  }
  div.index button:disabled {
    color: lightgray;
    box-shadow: inset 0px 4px 4px rgba(0, 0, 0, 0.1);
  }
  p {
    font-size: 15px;
    border-radius: 50px;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
    text-align: center;
    padding: 10px 25px;
    background: #efefef;
  }
</style>