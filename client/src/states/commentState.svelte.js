let comments = $state(
    typeof localStorage !== "undefined" && localStorage.getItem("comments")
        ? JSON.parse(localStorage.getItem("comments"))
        : []
);

const useCommentState = () => {
    return {
        get count() {
            return comments.length;
        },
        get comments() {
            return comments;
        },
        add: (comment) => {
            if (comment.trim() !== "") {
                comments.push(comment);

                // Save updated comments to localStorage
                if (typeof localStorage !== "undefined") {
                    localStorage.setItem("comments", JSON.stringify(comments));
                }
            }
        },
    };
};

export { useCommentState };