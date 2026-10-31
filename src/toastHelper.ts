
// A small wrapper over Bootstrap Toast

import { Toast } from "bootstrap";

// is that by default it won't alert when the user isn't logged in
export function displayToastMessage(title: string, body: string) {
    displayToast(title,body,'text-bg-primary');
}

export function displayToastWarning(title: string, body: string) {
    displayToast(title,body,'text-bg-warning');
}
export function displayToastError(title: string, body: string) {
    displayToast(title,body,'text-bg-danger');
}

function displayToast(title: string, body: string, textBackground:string){
    var toast = document.getElementById('baseToast') as HTMLElement;
    toast.classList.remove('text-bg-primary');
    toast.classList.remove('text-bg-warning');
    toast.classList.remove('text-bg-danger');
    toast.classList.add(textBackground);
    var titleElement = document.getElementById('baseToastTitle') as HTMLElement;
    titleElement.innerText = title;
    var bodyElement = document.getElementById('baseToastBody') as HTMLElement;
    bodyElement.innerText = body
    var baseToast = Toast.getOrCreateInstance('#baseToast')
    baseToast?.show();

}