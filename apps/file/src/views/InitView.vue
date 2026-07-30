<template>
    <div class="init">
    </div>
</template>

<script>
export default {
    name: 'HomeView',
    created() {
        if (this.$route.query.pw) {
            this.$router.push({
                name: 'home',
                params: { pw: this.$route.query.pw }
            })
        }

    }

}
</script>
