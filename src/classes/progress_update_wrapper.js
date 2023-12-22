
class ProgressUpdateWrapper {
    constructor(type, update_func = undefined) {
        this.type = type;
        this.update_func = this.update;
        if (update_func != undefined) {
            this.update_func = update_func;
        }
    }
    update() {

    }
    update_line() {

    }
}

class DiscordUpdateWrapper extends ProgressUpdateWrapper {
    constructor(interaction) {
        super("discord");
        this.interaction = interaction;
        this.previous_message_list = [];
    }
    update(new_text) {
        this.interaction.editReply(this.previous_message_list.join("\n") + "\n" + new_text);
        this.previous_message_list.push(new_text);
    }
    update_line(reg_replace, new_value) {
        const new_line = this.previous_message_list[this.previous_message_list.length-1].replace(reg_replace, new_value);
        this.previous_message_list[this.previous_message_list.length-1] = new_line;
        this.interaction.editReply(this.previous_message_list.join("\n"));
    }
}


module.exports = {ProgressUpdateWrapper, DiscordUpdateWrapper};