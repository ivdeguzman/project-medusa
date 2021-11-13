<script>
  import { onDestroy, onMount } from "svelte";
  import { fly, fade } from "svelte/transition";
  import AttendanceCard from "../interface/AttendanceCard.svelte";
  const io = require("socket.io-client");
  const socket = io("http://127.0.0.1:14500");
  export let selectedProfile;
  let attendanceData;

  onMount(() => {
    socket.emit("attendanceDataGet", selectedProfile._id);
  });

  onDestroy(() => {
    socket.disconnect();
    attendanceData = undefined;
  })

  socket.on("attendanceDataRetrieveList", list => {
    try {
      attendanceData = list;
    } catch {
      list = undefined;
    }
  });

  socket.on("attendanceDataInsert", insert => {
    try {
      if (insert.UserId == selectedProfile._id) {
        attendanceData = [insert, ...attendanceData];
      }
    } catch {
      insert = undefined;
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
</script>

{#if attendanceData}
  {#if attendanceData.length != 0}
    <table class=container in:fly={{ delay: 500, y: -50, duration: 250 }} out:fade={{ duration: 200 }}>
      <tr>
        <th>Status</th>
        <th>Via</th>
        <th>Date</th>
        <th>Time</th>
      </tr>
      {#each attendanceData as attendance (attendance._id)}
        <AttendanceCard {attendance} />
      {/each}
    </table>
  {:else}
    <p in:fly={{ delay: 500, y: -50, duration: 250 }} out:fade={{ duration: 200 }}>This person currently holds no record.</p>
    <p in:fly={{ delay: 500, y: -50, duration: 250 }} out:fade={{ duration: 200 }}>Please check again later.</p>
  {/if}
{/if}

<style>
  table.container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    margin-top: 20px;
    width: 100%;
    text-align: center;
    border-spacing: 5px;
  }
  th {
    padding: 7px 10px;
    border: 1px solid rgba(0, 0, 0, 0.5);
    border-radius: 10px;
  }
  p {
    text-align: center;
    font-size: 25px;
    font-weight: 100;
  }
  p:first-child {
    margin-top: 50px;
  }
  @media screen and (min-width: 1028px) {
    table.container {
      width: 960px;
    }
  }
</style>