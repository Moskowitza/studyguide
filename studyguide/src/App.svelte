<script>
  export let name;
  import Quiz from "./Quiz.svelte";
</script>

<style>
  h1 {
    color: purple;
  }
</style>

<h1>Hello {name}!</h1>
<Quiz />
