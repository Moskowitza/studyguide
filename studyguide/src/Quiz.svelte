<script>
  let result = "answer is _";
  let pickAnswer = a => {
    result = `answer is ${a}`;
  };
</script>

<style>
  h1 {
    color: red;
    display: block;
  }
</style>

<div>

  <h4>&#8203 {result}</h4>
  <button on:click={() => pickAnswer('a')}>A</button>
  <button on:click={() => pickAnswer('b')}>B</button>
  <button on:click={() => pickAnswer('c')}>C</button>
  <button on:click={() => pickAnswer('d')}>D</button>
</div>
