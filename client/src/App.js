import React from "react";
import ImageUploading from "react-images-uploading";
import { useForm } from "react-hook-form";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import api from "./api";
import Container from "@material-ui/core/Container";
import Typography from "@material-ui/core/Typography";
import makeStyles from "@material-ui/core/styles/makeStyles";
import ImageUpload from "./ImageUpload";

const useStyles = makeStyles((theme) => ({
  root: {
    height: "100vh",
  },
  form: {
    display: "flex",
    width: "20vw",
    height: "60vh",
    justifyContent: "space-around",
    flexDirection: "column",
  },
  buttons: { display: "flex" },

  heading: {
    fontSize: theme.typography.pxToRem(15),
    fontWeight: theme.typography.fontWeightRegular,
  },
}));

export function App() {
  const { handleSubmit, register } = useForm();
  const [images, setImages] = React.useState([]);
  const classes = useStyles();

  const onSubmit = async ({ email }) => {
    let bodyFormData = new FormData();
    const [driverLicense, carLicense, id] = images.map((img) => img["file"]);
    bodyFormData.append("email", email);
    bodyFormData.append("driverLicense", driverLicense);
    bodyFormData.append("carLicense", carLicense);
    bodyFormData.append("id", id);
    try {
      const res = await api.post("/", bodyFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log(res);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div className="App">
      <Container maxWidth="md">
        <Typography variant="h2">Rosh Ha Ayin parking validation</Typography>
        <ImageUpload images={images} setImages={setImages} />
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            placeholder={"Ex. avi123@gmail.com"}
            fullWidth
            inputRef={register}
            name={"email"}
          />
          <Button type="submit">Submit</Button>
        </form>
      </Container>
    </div>
  );
}
