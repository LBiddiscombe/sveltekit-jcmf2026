<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-6">
	<h1 class="text-4xl font-bold">JCMF Remake</h1>
	<p class="text-lg text-gray-500">Jack Charlton's Match Fishing</p>
	<button onclick={() => goto('/menu')} class="mt-4 rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
		Start
	</button>
</div>
