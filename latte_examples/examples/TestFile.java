import specification.Unique;
import specification.Free;

public class TestFile{
	@Unique Object value;

	public void test ( @Free Object value) {
        this.value = value;

        // Object c = this.value;
    } 
 
}