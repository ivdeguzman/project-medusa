<script>
  import { studentData } from "../stores/student";
  import { employeeCurrentIndex } from "../stores/employee";
  import { searchValue, searchResults } from "../stores/search";
  import StudentCard from "../components/StudentCard.svelte";
  import Searchbar from "../components/Searchbar.svelte";

  $employeeCurrentIndex = 1;
  $searchValue = "";  
</script>

<div class="flex md:mb-24 mb-16 mx-5 items-center flex-col">
  <Searchbar />
  {#if $searchValue == "" || $searchValue.length < 2}
    {#await $studentData then studentData}
      {#each studentData as student (student._id)}
        <StudentCard {student} />
      {/each}
    {/await}
  {:else if $searchValue.length >= 2}
    {#await $searchResults then studentData}
      {#each studentData.queryResults as student (student._id)}
        <StudentCard {student} />
      {/each}
    {/await}
  {/if}
</div>