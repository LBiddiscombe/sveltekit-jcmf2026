<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-6">
	<h1 class="text-4xl font-bold text-dark-teal">JCMF Remake</h1>
	<p class="text-lg text-muted">Jack Charlton's Match Fishing</p>
	<button onclick={() => goto('/menu')} class="mt-4 rounded bg-primary px-6 py-2 text-white hover:bg-primary/80">
		Start
	</button>
</div>
