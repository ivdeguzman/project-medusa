<script>
  import { fly, fade } from 'svelte/transition';
  export let attendance;
</script>

<tr in:fly={{ delay: 350, y: -50, duration: 250 }} out:fade={{ duration: 200 }}>
  <td>{attendance.LoggedIn ? "Logged In" : "Logged Out"}</td>
  <td>{attendance.Via}</td>
  <td>{attendance.Date.Day}-{attendance.Date.Month}-{attendance.Date.Year}</td>
  <td>{attendance.Time.Hour}:{attendance.Time.Minute}:{attendance.Time.Second}</td>
</tr>

<style>
  td {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    padding: 5px 10px;
  }
</style>