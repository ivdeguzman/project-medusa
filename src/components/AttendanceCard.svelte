<script>
  import { fly, fade } from "svelte/transition";
  export let attendance;
</script>

<tr>
  <td in:fly={{ delay: 500, y: -50, duration: 200 }} out:fade={{ duration: 200 }} class="px-4 py-2 border-b border-r border-l border-black border-dashed font-light custom-bg-red">{attendance.LoggedIn ? "Logged In" : "Logged Out"}</td>
  <td in:fly={{ delay: 500, y: -50, duration: 200 }} out:fade={{ duration: 200 }} class="px-4 py-2 border-b border-r border-l border-black border-dashed font-light custom-bg-blue">{attendance.Via}</td>
  <td in:fly={{ delay: 500, y: -50, duration: 200 }} out:fade={{ duration: 200 }} class="px-4 py-2 border-b border-r border-l border-black border-dashed font-light custom-bg-red">{attendance.Date.Day}-{attendance.Date.Month}-{attendance.Date.Year}</td>
  <td in:fly={{ delay: 500, y: -50, duration: 200 }} out:fade={{ duration: 200 }} class="px-4 py-2 border-b border-r border-l border-black border-dashed font-light custom-bg-blue">{attendance.Time.Hour}:{attendance.Time.Minute}:{attendance.Time.Second}</td>
</tr>
