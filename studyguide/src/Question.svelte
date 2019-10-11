<script>
  export let question;
  let isCorrect;
  let isAnswered = false;
  export let count = 0;
  let correctAnswer = question.correct_answer;
  let answers = question.incorrect_answers.map(answer => {
    return {
      answer,
      correct: false
    };
  });
  let allAnswers = [...answers, { answer: correctAnswer, correct: true }];

  function shuffle(array) {
    array.sort(() => Math.random() - 0.5);
  }
  shuffle(allAnswers);
  function checkQuestion(ans) {
    isAnswered = true;
    isCorrect = ans;

    count++;
  }
</script>

<style>
  button {
    display: inline;
    padding: 0;
    padding: 2em;
  }
  button:hover {
    background: lightgrey;
  }
  .answer_continer {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    max-width: 350px;
  }
</style>

<h3>
  {@html question.question}
</h3>
{#if isAnswered}
  <h4>
    {#if isCorrect}You got that one right{:else}WRONG!!!!{/if}
  </h4>
{/if}
<div class="answer_continer">
  {#each allAnswers as answer}
    <button on:click={() => checkQuestion(answer.correct)}>
      {@html answer.answer}
    </button>
  {/each}
</div>
