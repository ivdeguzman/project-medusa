<script>
  import { onDestroy, onMount } from "svelte";
  import { fade } from 'svelte/transition';
  import AttendanceCard from "../interface/AttendanceCard.svelte";
  const io = require("socket.io-client");
  const socket = io("http://127.0.0.1:14500");
  export let selectedProfile;
  let attendanceData, currentIndex, indices;

  onMount(() => {
    socket.emit("attendanceDocumentCountGet", selectedProfile._id);
  });

  onDestroy(() => {
    socket.disconnect();
    attendanceData = undefined;
    indices = undefined;
    currentIndex = undefined;
  })

  socket.on("attendanceDocumentRetrieveList", value => {
    try {
      indices = value;
      currentIndex = 1;
      socket.emit("attendanceDataGet", selectedProfile._id);
    } catch {
      value = undefined;
    }
  });

  socket.on("attendanceDataRetrieveList", list => {
    try {
      attendanceData = list;
    } catch {
      list = undefined;
    }
  });

  socket.on("attendanceDataUpdate", update => {
    try {
      attendanceData.forEach(attendance => {
        if (attendance._id == update._id) {
          attendance.UserId = update.UserId;
          attendance.Time.Hour = update.Time.Hour;
          attendance.Time.Minute = update.Time.Minute;
          attendance.Time.Second = update.Time.Second;
          attendance.Date.Day = update.Date.Day;
          attendance.Date.Month = update.Date.Month;
          attendance.Date.Year = update.Date.Year;
          attendance.LoggedIn = update.LoggedIn;
          attendance.Via = update.Via;
        }
      });
      attendanceData = attendanceData;
    } catch {
      update = undefined;
    }
  });

  socket.on("attendanceDataDelete", deleted => {
    try {
      const updatedAttendanceData = attendanceData.filter(Attendance => {
        return Attendance._id != deleted;
      });
      attendanceData = updatedAttendanceData;
   } catch {
     deleted = undefined;
   }
  });

  let subtract = () => {
    currentIndex != 1 && currentIndex != 0 ? currentIndex-- : currentIndex;
    socket.emit("attendanceDataGet", selectedProfile._id, currentIndex - 1);
  }

  let add = () => {
    currentIndex != indices ? currentIndex++ : currentIndex;
    socket.emit("attendanceDataGet", selectedProfile._id, currentIndex - 1);
  }
</script>

{#if attendanceData && selectedProfile != null}
  {#if attendanceData.length != 0 && selectedProfile != null}
    <table class=container in:fade={{ delay: 350, duration: 200 }} out:fade={{ duration: 200 }}>
      <tr>
        <th>Status</th>
        <th>Via</th>
        <th>Date DD-MM-YYYY</th>
        <th>Time HH:MM:SS</th>
      </tr>
      {#each attendanceData as attendance (attendance._id)}
        <AttendanceCard {attendance} />
      {/each}
    </table>
    {#if indices}
      <div class="index" in:fade={{ delay: 500, duration: 200 }} out:fade={{ duration: 200 }}>
        <button disabled={currentIndex == 1 || currentIndex == 0 || typeof currentIndex == "string"} on:click={subtract}>Back</button>
        <p>{currentIndex} out of {indices}</p>
        <button disabled={currentIndex == indices || typeof currentIndex == "string"} on:click={add}>Next</button>
      </div>
    {/if}
  {:else}
    <p in:fade={{ delay: 350, duration: 200 }} out:fade={{ duration: 200 }}>This person currently holds no record.</p>
    <p in:fade={{ delay: 350, duration: 200 }} out:fade={{ duration: 200 }}>Please check again later.</p>
  {/if}
{/if}

<style>
  table.container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    margin-top: 20px;
    width: 100%;
    text-align: center;
    border-spacing: 5px;
    margin-bottom: 64px;
  }
  th {
    background: #efefef;
    padding: 7px 10px;
    border: 1px solid rgba(0, 0, 0, 0.5);
    border-radius: 10px;
    z-index: 10;
  }
  p {
    text-align: center;
    font-size: 25px;
    font-weight: 100;
  }
  p:first-child {
    margin-top: 50px;
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
  div.index p {
    font-size: 15px;
    border-radius: 50px;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
    text-align: center;
    padding: 10px 25px;
    background: #efefef;
  }
  @media screen and (min-width: 1028px) {
    table.container {
      width: 960px;
    }
  }
</style>