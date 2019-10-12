<script>
  import Quiz from "./Quiz.svelte";
</script>

<style>
  :global(body) {
    background: hsla(0, 0%, 0%, 0.8);
  }
  h1 {
    color: white;
    text-align: center;
  }
  div {
    background: white;
    border-radius: 15px;
    padding: 40px;
  }
</style>

<h1>Animal Quiz</h1>
<div>
  <Quiz />
</div>
