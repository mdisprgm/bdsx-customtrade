import { FormDataCustom } from "bdsx/bds/form";
export namespace EditorWindow {
    export const AddRecipe: FormDataCustom = {
        type: "custom_form",
        title: "§l§aVillager Editor",
        content: [
            {
                type: "input",
                text: "구매1 아이템 이름을 입력하세요",
            },
            {
                type: "slider",
                text: "구매1 아이템 개수를 입력하세요",
                max: 64,
                min: 1,
                default: 1,
            },
            {
                type: "input",
                text: "구매2 아이템 이름을 입력하세요",
            },
            {
                type: "slider",
                text: "구매2 아이템 개수를 입력하세요",
                max: 64,
                min: 1,
                default: 1,
            },
            {
                type: "input",
                text: "판매 아이템 이름을 입력하세요",
            },
            {
                type: "slider",
                text: "판매 아이템 개수를 입력하세요",
                max: 64,
                min: 1,
                default: 1,
            },
        ],
    };
}
