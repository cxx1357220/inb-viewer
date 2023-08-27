<template>
    <!-- <div class="view"> -->
    <el-button size="mini" v-if="state == 'done'" type="success">done</el-button>
    <el-button size="mini" v-else-if="state == 'error'" type="danger">error</el-button>
    <el-button size="mini" v-else-if="state == 'waiting'" type="info">waiting</el-button>
    <!-- <el-button size="mini" v-else :loading="true" v-state="state"></el-button> -->
    <el-button size="mini" v-else :loading="true" >{{ state }}</el-button>

    <!-- </div> -->
</template>

<script>

export default {
    name: 'state',
    data() {
        return {
        }
    },
    props: ['state'],
    directives: {
        state: {
            bind(el, binding) {
                try {
                    el.innerHTML = binding.value
                } catch (error) {
                    console.log(binding.value);
                }
            },
            update(el, binding) {
                try {
                    el.innerHTML = binding.value
                    // throttle(() => { el.innerHTML = binding.value })
                } catch (error) {
                    console.log(binding.value);
                }
            },
        },
    },

    created() {
    },
    mounted() {
    },
    methods: {

    }

}
</script>
<style lang="less" scoped></style>