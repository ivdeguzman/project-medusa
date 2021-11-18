<script>
  export let attendance;
</script>

<tr>
  <td>{attendance.LoggedIn ? "Logged In" : "Logged Out"}</td>
  <td>{attendance.Via}</td>
  <td>{attendance.Date.Day}-{attendance.Date.Month}-{attendance.Date.Year}</td>
  <td>{attendance.Time.Hour}:{attendance.Time.Minute}:{attendance.Time.Second}</td>
</tr>

<style>
  td {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    padding: 5px 10px;
    z-index: 0;
  }
</style>