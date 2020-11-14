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
import Box from "@material-ui/core/Box";
import Paper from "@material-ui/core/Paper";
import logo from "./static/logo.png";

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
  header: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {},
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
    <div>
      <Container maxWidth="md">
        <Paper className={classes.container} elevation={3}>
          <div className={classes.header}>
            <Typography variant="h2">הנפקת תו חניה אוטומטית</Typography>
            <Typography variant="h4">עיריית ראש העין</Typography>
            <img src={logo} height="111px" width="140px" />
          </div>
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
        </Paper>
      </Container>
    </div>
  );
}
