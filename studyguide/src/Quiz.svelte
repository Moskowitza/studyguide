<script>
  let result = null;
  let answer = ["a", "b", "c", "d"];
  let quiz = getQuiz();
  let pickAnswer = a => {
    result = `answer is ${a.toUpperCase()}`;
  };
  async function getQuiz() {
    const res = await fetch(
      "https://opentdb.com/api.php?amount=10&category=27&type=multiple"
    );
    const quiz = await res.json();
    return quiz;
  }
  function handleClick() {
    quiz = getQuiz();
  }
</script>

<style>
  h4 {
    color: red;
    display: block;
  }
</style>

<h1>Quiz</h1>
<button on:click={handleClick}>Get Quiz</button>
{#await quiz}loading{:then data}{data.results[0].question}{/await}
<div>
  {#if result}
    <h4>{result}</h4>
  {:else}
    <h4>&#8203</h4>
  {/if}
  {#each answer as item}
    <button on:click={() => pickAnswer(item)}>
      Answer {item.toUpperCase()}
    </button>
  {/each}

</div>

