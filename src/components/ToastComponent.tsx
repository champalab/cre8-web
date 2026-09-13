import { alertError, alertSuccess } from "../utils/alerts";

const ToastComponent = (data: any) => {
  if (data.status == "success" || data.success === true) {
    alertSuccess({ title: data.message, timer: 1500 });
    return;
  } else if (data.messages) {
    for (const item of data.messages) {
      alertError({ title: item['msg'], timer: 3000 });
    }
  } else if (data.message) {
    alertError({ title: data.message, timer: 3000 });
  }
};

export default ToastComponent;


