export const commentState = $state({
    comments: [],

    get total() {
        return this.comments.length;
    },

    add(text) {
        this.comments = [...this.comments, text];
    }
});