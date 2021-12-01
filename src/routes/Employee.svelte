<script>
  import { employeeData } from "../stores/employee";
  import { studentCurrentIndex } from "../stores/student";
  import { searchValue, searchResults } from "../stores/search";
  import EmployeeCard from "../components/EmployeeCard.svelte";
  import Searchbar from "../components/Searchbar.svelte";

  $studentCurrentIndex = 1;
  $searchValue = "";
</script>

<div class="flex md:mb-24 mb-16 mx-5 items-center flex-col">
  <Searchbar />
  {#if $searchValue == "" || $searchValue.length < 2}
    {#await $employeeData then employeeData}
      {#each employeeData as employee (employee._id)}
        <EmployeeCard {employee} />
      {/each}
    {/await}
  {:else if $searchValue.length >= 2}
    {#await $searchResults then employeeData}
      {#each employeeData.queryResults as employee (employee._id)}
        <EmployeeCard {employee} />
      {/each}
    {/await}
  {/if}
</div>