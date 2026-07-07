<template>
    <div class="home">
        <input type="text" v-model="value" @blur="or">
    </div>

</template>

<script>
export default {
    name: 'HomeView',
    data() {
        return {
            value: ''
        }
    },
    watch: {
        value(n) {
            if (n == '665533') {
                // this.$router.push({
                //     name: 'home',
                // })
            }
        }
    },
    methods: {
        or() {
            if (this.value == '665533') {
                this.$router.push({
                    name: 'home',
                    params: { value: this.value }
                })
            }
        }
    }

}
</script>
